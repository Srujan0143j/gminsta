import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey_gminsta_2026', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

export default generateToken;
