import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ✅ যেকোনো লগইন করা ইউজার ঢুকতে পারবে (Admin না হলেও)
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid Token' });
  }
};

// ✅ শুধু অ্যাডমিন ঢুকতে পারবে
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied - Admin Only' });
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid Token' });
  }
};
