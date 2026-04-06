export default function adminCheck(req, res, next) {
  if (!req.headers.admin) return res.status(403).send('Forbidden');
  next();
}