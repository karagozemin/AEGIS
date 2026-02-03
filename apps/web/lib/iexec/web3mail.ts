import { IExecWeb3mail, type Contact } from "@iexec/web3mail";
import type { BrowserProvider } from "ethers";

/**
 * Initialize Web3Mail with browser wallet
 */
export function createWeb3Mail(provider: BrowserProvider) {
  return new IExecWeb3mail(provider);
}

/**
 * Send VaR report via encrypted email
 */
export async function sendVaRReport(
  web3mail: IExecWeb3mail,
  recipientAddress: string,
  report: {
    assetId: string;
    varScore: number;
    safeLTV: number;
    iterations: number;
    taskId: string;
    timestamp: Date;
  }
): Promise<string> {
  const emailContent = `
    <h1>Aegis Prime - VaR Risk Report</h1>
    
    <h2>Asset Analysis Complete</h2>
    
    <table style="border-collapse: collapse; width: 100%;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Asset ID</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${report.assetId}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Value-at-Risk (95%)</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">$${report.varScore.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Safe LTV Ratio</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${(report.safeLTV / 100).toFixed(2)}%</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Monte Carlo Iterations</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${report.iterations.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>TEE Task ID</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${report.taskId}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Computed At</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${report.timestamp.toISOString()}</td>
      </tr>
    </table>
    
    <p style="margin-top: 20px; color: #666;">
      This risk assessment was computed inside an Intel SGX Trusted Execution Environment.
      The underlying financial data remains encrypted and private.
    </p>
    
    <p style="color: #0f969c;">
      Powered by Aegis Prime & iExec Confidential Computing
    </p>
  `;

  const { taskId } = await web3mail.sendEmail({
    emailSubject: `[Aegis Prime] VaR Report - Asset ${report.assetId.slice(0, 8)}...`,
    emailContent,
    protectedData: recipientAddress, // User's protected email address
    contentType: "text/html",
  });

  return taskId;
}

/**
 * Check if user has a protected email registered
 */
export async function checkEmailProtected(
  web3mail: IExecWeb3mail,
  userAddress: string
): Promise<boolean> {
  try {
    const contacts = await web3mail.fetchMyContacts();
    return contacts.some(
      (contact: Contact) =>
        contact.owner.toLowerCase() === userAddress.toLowerCase()
    );
  } catch {
    return false;
  }
}

/**
 * Fetch user's contact information
 */
export async function fetchUserContacts(
  web3mail: IExecWeb3mail
): Promise<Contact[]> {
  return web3mail.fetchMyContacts();
}
