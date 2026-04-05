import { userService } from '../services/userService.js';
export const userController = {
  async get(req, res) {
    const user = await userService.getUser(req.params.id);
    res.json(user);
  },
};
