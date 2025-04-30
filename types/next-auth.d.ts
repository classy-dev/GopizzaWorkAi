import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    userId: string;
    department: string;
    apiKey?: string;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      userId: string;
      department: string;
      apiKey?: string;
      isAdmin: boolean;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    userId: string;
    department: string;
    apiKey?: string;
    isAdmin: boolean;
  }
}
