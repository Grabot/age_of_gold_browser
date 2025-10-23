import { user } from '../stores/userStore';
import type { User } from "../types/user";
import { loginWithToken } from '../services/loginService';


export async function handleTokenLogin() {
    const accessToken = localStorage.getItem('access_token');
  
    if (accessToken) {
        try {
            const result = await loginWithToken(accessToken);
            if (!result.success) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                return false;
            }
            return true;
        } catch (err) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            console.error('Error during token login:', err);
            return false;
        }
    }
    return false;
}