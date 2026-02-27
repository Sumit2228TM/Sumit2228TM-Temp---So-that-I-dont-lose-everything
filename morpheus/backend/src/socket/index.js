import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { db } from '../db/connect.js';
import { messages, conversations, students, tutors, sessions, callEvents } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// ─── Helper: verify user is a participant in the conversation ─────────────────
async function resolveParticipant(userId, role) {
    if (role === 'student') {
        const [student] = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.userId, userId))
            .limit(1);
        return student ?? null;
    }
    if (role === 'tutor') {
        const [tutor] = await db
            .select({ id: tutors.id })
            .from(tutors)
            .where(eq(tutors.userId, userId))
            .limit(1);
        return tutor ?? null;
    }
    return null;
}

async function isConversationParticipant(conversation, userId, role) {
    const participant = await resolveParticipant(userId, role);
    if (!participant) return false;
    if (role === 'student') return conversation.studentId === participant.id;
    if (role === 'tutor') return conversation.tutorId === participant.id;
    return false;
}

export function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // ─── Socket Authentication Middleware ─────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }
        try {
            const payload = verifyAccessToken(token);
            socket.user = payload;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

        // ─── join_conversation ────────────────────────────────────────────────
        socket.on('join_conversation', async (conversationId) => {
            try {
                const [conversation] = await db
                    .select()
                    .from(conversations)
                    .where(eq(conversations.id, conversationId))
                    .limit(1);

                if (!conversation) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                const ok = await isConversationParticipant(conversation, socket.user.id, socket.user.role);
                if (!ok) {
                    return socket.emit('error', { message: 'Unauthorized access to this conversation' });
                }

                // Cache resolved participant ID on the socket for fast reuse
                socket._conversationId = conversationId;
                socket._conversationRecord = conversation;

                socket.join(conversationId);
                console.log(`User ${socket.user.id} joined conversation: ${conversationId}`);
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        });

        // ─── send_message ─────────────────────────────────────────────────────
        // Security: verify the sender is actually a participant in the conversation
        // before persisting. Prevents sending to arbitrary conversation IDs.
        socket.on('send_message', async ({ conversationId, content, type = 'text', metadata = {} }) => {
            try {
                if (!content || typeof content !== 'string' || !content.trim()) {
                    return socket.emit('error', { message: 'Message content cannot be empty' });
                }

                // Fetch and verify participation (re-verify even if already joined,
                // in case the socket re-uses a stale cached ID)
                const [conversation] = await db
                    .select()
                    .from(conversations)
                    .where(eq(conversations.id, conversationId))
                    .limit(1);

                if (!conversation) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                const ok = await isConversationParticipant(conversation, socket.user.id, socket.user.role);
                if (!ok) {
                    return socket.emit('error', { message: 'Unauthorized: you are not part of this conversation' });
                }

                const newMessage = await db.transaction(async (tx) => {
                    const [msg] = await tx
                        .insert(messages)
                        .values({
                            conversationId,
                            senderId: socket.user.id,
                            content: content.trim(),
                            type,
                            metadata,
                        })
                        .returning();

                    await tx
                        .update(conversations)
                        .set({ lastMessageAt: new Date() })
                        .where(eq(conversations.id, conversationId));

                    return msg;
                });

                io.to(conversationId).emit('new_message', newMessage);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // ─── send_schedule_request (TUTOR only) ─────────────────────────────
        // Tutor proposes a session time inside the chat.
        // Sends a structured 'schedule_request' message that the student responds to.
        socket.on('send_schedule_request', async ({ conversationId, topic, subjectId, scheduledAt }) => {
            if (socket.user.role !== 'tutor') {
                return socket.emit('error', { message: 'Only tutors can send schedule proposals' });
            }

            if (!subjectId || !scheduledAt) {
                return socket.emit('error', { message: 'subjectId and scheduledAt are required' });
            }

            try {
                const [conversation] = await db
                    .select()
                    .from(conversations)
                    .where(eq(conversations.id, conversationId))
                    .limit(1);

                if (!conversation) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                const [tutor] = await db
                    .select({ id: tutors.id })
                    .from(tutors)
                    .where(eq(tutors.userId, socket.user.id))
                    .limit(1);

                if (!tutor || conversation.tutorId !== tutor.id) {
                    return socket.emit('error', { message: 'Unauthorized: you are not the tutor in this conversation' });
                }

                const [msg] = await db
                    .insert(messages)
                    .values({
                        conversationId,
                        senderId: socket.user.id,
                        content: `Session proposal: ${topic || 'Tutoring session'} on ${new Date(scheduledAt).toLocaleString()}`,
                        type: 'schedule_request',
                        metadata: {
                            topic: topic || null,
                            subjectId,
                            scheduledAt,
                            status: 'pending', // pending | accepted | rejected
                        },
                    })
                    .returning();

                await db
                    .update(conversations)
                    .set({ lastMessageAt: new Date() })
                    .where(eq(conversations.id, conversationId));

                io.to(conversationId).emit('new_message', msg);
            } catch (error) {
                console.error('Error sending schedule request:', error);
                socket.emit('error', { message: 'Failed to send schedule proposal' });
            }
        });

        // ─── respond_to_schedule (STUDENT only) ──────────────────────────────
        // Student accepts or rejects the tutor's schedule proposal.
        // On acceptance, a session row is created from the conversation's participants.
        socket.on('respond_to_schedule', async ({ conversationId, messageId, status }) => {
            if (socket.user.role !== 'student') {
                return socket.emit('error', { message: 'Only students can respond to schedule proposals' });
            }

            if (!['accepted', 'rejected'].includes(status)) {
                return socket.emit('error', { message: 'Status must be accepted or rejected' });
            }

            try {
                // 1. Verify conversation and that this student is a participant
                const [conversation] = await db
                    .select()
                    .from(conversations)
                    .where(eq(conversations.id, conversationId))
                    .limit(1);

                if (!conversation) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                const [student] = await db
                    .select({ id: students.id })
                    .from(students)
                    .where(eq(students.userId, socket.user.id))
                    .limit(1);

                if (!student || conversation.studentId !== student.id) {
                    return socket.emit('error', { message: 'Unauthorized: you are not the student in this conversation' });
                }

                // 2. Fetch the original schedule_request message to get metadata
                const [originalMsg] = await db
                    .select()
                    .from(messages)
                    .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId)))
                    .limit(1);

                if (!originalMsg || originalMsg.type !== 'schedule_request') {
                    return socket.emit('error', { message: 'Original schedule request not found' });
                }

                if (originalMsg.metadata?.status !== 'pending') {
                    return socket.emit('error', { message: 'This schedule request has already been responded to' });
                }

                const responseMessage = await db.transaction(async (tx) => {
                    // 3. Update original message status
                    await tx
                        .update(messages)
                        .set({
                            metadata: sql`${messages.metadata}::jsonb || ${JSON.stringify({ status })}::jsonb`,
                        })
                        .where(eq(messages.id, messageId));

                    // 4. If accepted, create the session using metadata from the request message
                    let sessionId = null;
                    if (status === 'accepted') {
                        const { subjectId, scheduledAt, topic } = originalMsg.metadata;

                        const [newSession] = await tx
                            .insert(sessions)
                            .values({
                                studentId: conversation.studentId, // from server — never client
                                tutorId: conversation.tutorId,     // from server — never client
                                subjectId,
                                topic: topic || null,
                                scheduledAt: new Date(scheduledAt),
                                status: 'scheduled',
                            })
                            .returning();

                        sessionId = newSession.id;
                    }

                    // 5. Post response message to chat
                    const [respMsg] = await tx
                        .insert(messages)
                        .values({
                            conversationId,
                            senderId: socket.user.id,
                            content: status === 'accepted'
                                ? '✅ Session accepted! It has been added to your schedule.'
                                : '❌ Session proposal declined.',
                            type: 'schedule_response',
                            metadata: { originalMessageId: messageId, status, sessionId },
                        })
                        .returning();

                    return respMsg;
                });

                io.to(conversationId).emit('new_message', responseMessage);
            } catch (error) {
                console.error('Error responding to schedule:', error);
                socket.emit('error', { message: 'Failed to respond to schedule' });
            }
        });

        // ─── typing ───────────────────────────────────────────────────────────
        socket.on('typing', ({ conversationId, isTyping }) => {
            socket.to(conversationId).emit('user_typing', {
                userId: socket.user.id,
                isTyping,
            });
        });

        // =====================================================================
        // ┌──────────────────────────────────────────────────────────────┐
        // │  WebRTC Signaling │
        // └──────────────────────────────────────────────────────────────┘
        // Room naming: `call:<sessionId>` — separate namespace from chat rooms
        // =====================================================================

        // ─── join_call ─────────────────────────────────────────────────────
        // Must be called before sending offer/answer/ICE.
        // Verifies the caller is a session participant, then joins the call room.
        socket.on('join_call', async ({ sessionId }) => {
            try {
                const [session] = await db
                    .select()
                    .from(sessions)
                    .where(eq(sessions.id, sessionId))
                    .limit(1);

                if (!session) {
                    return socket.emit('error', { message: 'Session not found' });
                }

                // Verify the socket user is a participant
                let isParticipant = false;
                if (socket.user.role === 'student') {
                    const [s] = await db.select({ id: students.id }).from(students)
                        .where(eq(students.userId, socket.user.id)).limit(1);
                    if (s && session.studentId === s.id) isParticipant = true;
                } else if (socket.user.role === 'tutor') {
                    const [t] = await db.select({ id: tutors.id }).from(tutors)
                        .where(eq(tutors.userId, socket.user.id)).limit(1);
                    if (t && session.tutorId === t.id) isParticipant = true;
                }

                if (!isParticipant) {
                    return socket.emit('error', { message: 'You are not a participant in this session' });
                }

                const callRoom = `call:${sessionId}`;
                socket.join(callRoom);
                socket._currentCallSession = sessionId;

                // Persist 'joined' event
                await db.insert(callEvents).values({
                    sessionId,
                    userId: socket.user.id,
                    eventType: 'joined',
                });

                // Notify the other peer that someone joined
                socket.to(callRoom).emit('call_peer_joined', {
                    userId: socket.user.id,
                    role: socket.user.role,
                });

                // Also notify the newly-joined peer if someone is already in the room.
                // This is required so the designated offerer can start WebRTC when joining second.
                const roomSockets = await io.in(callRoom).fetchSockets();
                const peers = roomSockets
                    .filter((s) => s.id !== socket.id)
                    .map((s) => ({
                        userId: s.user?.id,
                        role: s.user?.role,
                    }));

                socket.emit('call_room_state', {
                    sessionId,
                    peerCount: peers.length,
                    peers,
                });

                console.log(`User ${socket.user.id} (${socket.user.role}) joined call room: ${callRoom}`);
            } catch (error) {
                console.error('Error joining call:', error);
                socket.emit('error', { message: 'Failed to join call' });
            }
        });

        // ─── webrtc_offer (tutor → student) ────────────────────────────────────
        // Relay the SDP offer to the other peer in the call room.
        socket.on('webrtc_offer', ({ sessionId, offer }) => {
            socket.to(`call:${sessionId}`).emit('webrtc_offer', {
                offer,
                from: socket.user.id,
            });
        });

        // ─── webrtc_answer (student → tutor) ──────────────────────────────────
        socket.on('webrtc_answer', ({ sessionId, answer }) => {
            socket.to(`call:${sessionId}`).emit('webrtc_answer', {
                answer,
                from: socket.user.id,
            });
        });

        // ─── webrtc_ice_candidate (both directions) ─────────────────────────
        socket.on('webrtc_ice_candidate', ({ sessionId, candidate }) => {
            socket.to(`call:${sessionId}`).emit('webrtc_ice_candidate', {
                candidate,
                from: socket.user.id,
            });
        });

        // ─── call_event (mute / camera toggle) ──────────────────────────────
        // Persists the event to DB so dashboards can show mute history.
        // Also broadcasts to the other peer so their UI can update (e.g. show muted mic).
        const VALID_CALL_EVENTS = ['muted', 'unmuted', 'video_on', 'video_off'];
        socket.on('call_event', async ({ sessionId, eventType }) => {
            if (!VALID_CALL_EVENTS.includes(eventType)) {
                return socket.emit('error', { message: `Invalid event type: ${eventType}` });
            }
            try {
                await db.insert(callEvents).values({
                    sessionId,
                    userId: socket.user.id,
                    eventType,
                });

                // Broadcast to peer so their UI reflects the change
                socket.to(`call:${sessionId}`).emit('peer_call_event', {
                    userId: socket.user.id,
                    role: socket.user.role,
                    eventType,
                });
            } catch (error) {
                console.error('Error persisting call event:', error);
            }
        });

        // ─── end_call ──────────────────────────────────────────────────────────
        // Either party can end the call.
        // Marks session completed, sets endedAt, logs 'ended' event, notifies both.
        socket.on('end_call', async ({ sessionId }) => {
            try {
                const now = new Date();

                const [session] = await db
                    .select({ status: sessions.status })
                    .from(sessions)
                    .where(eq(sessions.id, sessionId))
                    .limit(1);

                if (!session) {
                    return socket.emit('error', { message: 'Session not found' });
                }

                // Only end if active (idempotent guard)
                if (session.status === 'active') {
                    await db
                        .update(sessions)
                        .set({ status: 'completed', endedAt: now })
                        .where(eq(sessions.id, sessionId));
                }

                // Persist 'ended' event for audit
                await db.insert(callEvents).values({
                    sessionId,
                    userId: socket.user.id,
                    eventType: 'ended',
                });

                // Notify both parties — they should navigate away from the call page
                io.to(`call:${sessionId}`).emit('call_ended', {
                    endedBy: socket.user.id,
                    role: socket.user.role,
                    endedAt: now,
                });

                // Clean up: everyone leaves the call room
                const callRoom = `call:${sessionId}`;
                io.in(callRoom).socketsLeave(callRoom);

                console.log(`Call ended: session ${sessionId} by ${socket.user.id} (${socket.user.role})`);
            } catch (error) {
                console.error('Error ending call:', error);
                socket.emit('error', { message: 'Failed to end call' });
            }
        });

        socket.on('disconnect', () => {
            // If user was in a call and disconnects abruptly, persist 'left' event
            if (socket._currentCallSession) {
                db.insert(callEvents).values({
                    sessionId: socket._currentCallSession,
                    userId: socket.user.id,
                    eventType: 'left',
                }).catch(console.error);

                // Notify peer that the other side disconnected
                socket.to(`call:${socket._currentCallSession}`).emit('peer_call_event', {
                    userId: socket.user.id,
                    role: socket.user.role,
                    eventType: 'left',
                });
            }
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });

    return io;
}
