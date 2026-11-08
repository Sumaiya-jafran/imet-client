export function googleErrorMessage(error?: string): string {
  if (!error) return '';
  switch (error) {
    case 'AccountLinkRequired':
      return 'This email already has an account. Sign in with your password, then connect Google in Account settings to use either method.';
    case 'GoogleLink':
      return 'Google could not be connected. Use the same verified email as your signed-in account. Your existing sign-in method still works.';
    case 'GoogleUnavailable':
    case 'Configuration':
      return 'Google sign-in is temporarily unavailable. Please try again later or use email and password if you have set one.';
    case 'GoogleAccountUnavailable':
      return 'This account cannot sign in with Google. Contact support if you need help with your account status.';
    case 'GoogleRateLimit':
      return 'Too many Google sign-in attempts. Please wait before trying again.';
    case 'OAuthSignin':
    case 'OAuthCallback':
      return 'Google authorization could not be completed. Start again and choose your Google account. If it keeps failing, contact support.';
    case 'AccessDenied':
      return 'Google sign-in was not approved. You can try again or use your existing email and password.';
    default:
      return 'Google sign-in could not be verified. Please try again or use your existing email and password.';
  }
}
