import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            // Create a dedicated Redis subscriber connection
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            const formattedUrl = redisUrl.includes('://') ? redisUrl : `redis://${redisUrl}`;
            const subscriber = new Redis(formattedUrl);

            subscriber.on('error', (err) => {
                console.error('[SSE Redis Error]:', err);
            });

            const channel = 'ctf-triggers';
            let isClosed = false;

            const cleanup = () => {
                if (isClosed) return;
                isClosed = true;
                console.log('[SSE] Cleaning up connection');
                clearInterval(heartbeat);
                subscriber.quit().catch(() => subscriber.disconnect());
                try {
                    controller.close();
                } catch (e) {
                    // Ignore error if controller is already closed
                }
            };

            const sendEvent = (data: any) => {
                if (isClosed) return;
                try {
                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                } catch (e) {
                    console.error('[SSE] Enqueue Error:', e);
                    cleanup();
                }
            };

            // Keep-alive heartbeat
            const heartbeat = setInterval(() => {
                if (isClosed) return;
                try {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                } catch (e) {
                    cleanup();
                }
            }, 30000);

            try {
                await subscriber.subscribe(channel);

                subscriber.on('message', (chan, message) => {
                    if (chan === channel) {
                        try {
                            const data = JSON.parse(message);
                            sendEvent(data);
                        } catch (e) {
                            console.error('SSE Message Parse Error:', e);
                        }
                    }
                });

                // Handle client disconnect
                req.signal.addEventListener('abort', () => {
                    cleanup();
                });

            } catch (err) {
                console.error('[SSE] Redis Subscribe Error:', err);
                cleanup();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
