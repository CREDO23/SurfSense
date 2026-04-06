import { execFile } from 'child_process';
import { promisify } from 'util';
import { systemPreferences } from 'electron';

const execFileAsync = promisify(execFile);
const EXEC_TIMEOUT_MS = 5_000;

async function run(cmd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(cmd, args, { timeout: EXEC_TIMEOUT_MS });
  return stdout.trim();
}

export async function getFrontmostApp(): Promise<string> {
  try {
    if (process.platform === 'darwin') {
      return await run('osascript', [
        '-e', 'tell application "System Events" to get name of first application process whose frontmost is true',
      ]);
    }
    if (process.platform === 'win32') {
      return await run('powershell', [
        '-command',
        "Add-Type 'using System; using System.Runtime.InteropServices; public class W { [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow(); }'; (Get-Process | Where-Object { $_.MainWindowHandle -eq [W]::GetForegroundWindow() }).ProcessName",
      ]);
    }
  } catch {
    return '';
  }
  return '';
}

export async function simulatePaste(): Promise<void> {
  try {
    if (process.platform === 'darwin') {
      await run('osascript', [
        '-e', 'tell application "System Events" to keystroke "v" using command down',
      ]);
    } else if (process.platform === 'win32') {
      await run('powershell', [
        '-command',
        "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')",
      ]);
    }
  } catch {
    // paste failed — nothing to recover
  }
}

export function checkAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.isTrustedAccessibilityClient(true);
}

export async function getWindowTitle(): Promise<string> {
  try {
    if (process.platform === 'darwin') {
      return await run('osascript', [
        '-e', 'tell application "System Events" to get title of front window of first application process whose frontmost is true',
      ]);
    }
    if (process.platform === 'win32') {
      return await run('powershell', [
        '-command',
        "(Get-Process | Where-Object { $_.MainWindowHandle -eq (Add-Type -MemberDefinition '[DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();' -Name W -PassThru)::GetForegroundWindow() }).MainWindowTitle",
      ]);
    }
  } catch {
    return '';
  }
  return '';
}

export function hasAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.isTrustedAccessibilityClient(false);
}
