import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            let isClosed = false;

            const cleanup = () => {
                if (isClosed) return;
                isClosed = true;
                clearInterval(heartbeat);
                try {
                    controller.close();
                } catch (e) {
                    // Ignore error if controller is already closed
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

            // Handle client disconnect
            req.signal.addEventListener('abort', () => {
                cleanup();
            });
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
