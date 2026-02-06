import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_PRIVATE_KEY = process.env.IEXEC_BACKEND_PRIVATE_KEY;

/**
 * POST /api/iexec/web3mail
 * Send risk report notification via iExec Web3Mail
 * 
 * Web3Mail enables sending emails to blockchain addresses without
 * knowing their email - the recipient must have opted in via iExec.
 */
export async function POST(req: NextRequest) {
  try {
    if (!BACKEND_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Backend private key not configured' },
        { status: 500 }
      );
    }

    const { 
      recipientAddress,
      subject,
      content,
    } = await req.json();

    if (!recipientAddress) {
      return NextResponse.json(
        { error: 'Missing recipientAddress' },
        { status: 400 }
      );
    }

    console.log('[API:web3mail] Sending Web3Mail notification...');
    console.log('[API:web3mail]   To:', recipientAddress);
    console.log('[API:web3mail]   Subject:', subject);

    // Dynamically import iExec Web3Mail SDK (server-side only, avoids bundling issues)
    const { IExecWeb3mail } = await import('@iexec/web3mail');
    const { utils } = await import('iexec');

    // Initialize on Bellecour sidechain (Web3Mail runs on Bellecour)
    const BELLECOUR_RPC = 'https://bellecour.iex.ec';
    const ethProvider = utils.getSignerFromPrivateKey(
      BELLECOUR_RPC,
      BACKEND_PRIVATE_KEY.startsWith('0x') ? BACKEND_PRIVATE_KEY : `0x${BACKEND_PRIVATE_KEY}`
    );
    
    const web3mail = new IExecWeb3mail(ethProvider as any);

    // Build the email content
    const emailSubject = subject || '🛡️ Aegis Prime - Risk Score Report';
    const emailContent = content || buildDefaultEmailContent();

    // Send the Web3Mail
    const { taskId } = await web3mail.sendEmail({
      protectedData: recipientAddress,
      emailSubject,
      emailContent,
      contentType: 'text/html',
      senderName: 'Aegis Prime',
    } as any);

    console.log('[API:web3mail] ✅ Web3Mail sent! Task:', taskId);

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Risk report sent via Web3Mail',
    });

  } catch (error: any) {
    console.error('[API:web3mail] ❌ Failed:', error?.message || error);
    if (error?.cause?.message) {
      console.error('[API:web3mail]    Cause:', error.cause.message);
    }

    const msg = error?.message || '';
    const causeMsg = error?.cause?.message || '';
    const combined = `${msg} ${causeMsg}`;

    // Handle common Web3Mail errors gracefully
    if (combined.includes('no protect data found') || combined.includes('protectedData') || combined.includes('No protected data')) {
      return NextResponse.json({
        success: false,
        error: 'Recipient has not opted into Web3Mail. They need to protect their email on iExec first.',
        code: 'NO_PROTECTED_EMAIL',
      }, { status: 422 });
    }

    // HYBRID MODE: Web3Mail requires the recipient to have protected their email
    // on iExec Bellecour. For hackathon demo, return a clear non-500 status.
    return NextResponse.json(
      {
        success: false,
        error: 'Web3Mail requires recipient to protect their email on iExec first. This is an iExec ecosystem feature.',
        code: 'WEB3MAIL_UNAVAILABLE',
        detail: error?.message || 'Failed to send Web3Mail',
      },
      { status: 422 }
    );
  }
}

/**
 * Build default HTML email content for risk report
 */
function buildDefaultEmailContent(): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e14; color: #e0e6ed; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0a0e14 0%, #141b24 100%); padding: 32px; text-align: center; border-bottom: 1px solid #1e2a38;">
        <h1 style="margin: 0; font-size: 24px; color: #00d4ff;">
          🛡️ AEGIS<span style="color: #00d4ff;">PRIME</span>
        </h1>
        <p style="margin: 8px 0 0; color: #6b7b8d; font-size: 14px;">
          Confidential RWA Risk Engine
        </p>
      </div>
      
      <div style="padding: 32px;">
        <h2 style="margin: 0 0 16px; color: #e0e6ed; font-size: 18px;">
          Your Risk Scores Have Been Updated
        </h2>
        
        <p style="color: #8b9ab0; line-height: 1.6;">
          Your portfolio risk scores have been computed inside a Trusted Execution 
          Environment (TEE) using Monte Carlo VaR simulation with 5,000+ iterations.
        </p>
        
        <div style="background: #141b24; border: 1px solid #1e2a38; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #00d4ff; font-size: 14px; font-weight: 600;">
            ✅ Scores stored on Arbitrum Sepolia
          </p>
          <p style="margin: 8px 0 0; color: #6b7b8d; font-size: 12px;">
            View your scores on the Aegis Prime dashboard
          </p>
        </div>
        
        <p style="color: #6b7b8d; font-size: 12px; margin-top: 24px;">
          This email was sent via iExec Web3Mail - your email address remains private.
        </p>
      </div>
    </div>
  `;
}
