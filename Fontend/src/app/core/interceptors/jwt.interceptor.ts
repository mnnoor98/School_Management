import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('sms_auth_token');
  const apiUrl = 'http://localhost:5000';

  let clonedReq = req;

  // Prepend backend base URL if relative path
  if (req.url.startsWith('/api/')) {
    clonedReq = req.clone({
      url: `${apiUrl}${req.url}`
    });
  }

  // Attach JWT Bearer token if present
  if (token) {
    clonedReq = clonedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq);
};
