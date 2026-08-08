import { authService } from '../src/server/services/auth.service';

async function test() {
  try {
    const mockCookieStore = {
      getAll: () => [],
      set: () => {}
    };
    
    // Register
    console.log('Registering...');
    await authService.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test' + Date.now() + '@senyx.com',
      password: 'Password!123'
    }, mockCookieStore);
    console.log('Registered!');

  } catch (err: any) {
    console.error('Test Failed:', err);
  }
}

test();
