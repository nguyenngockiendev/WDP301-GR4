import { CreateUserDTO, LoginDTO, ProfileDTO } from '../dto/UserDTO.js';
export class AuthController {
  constructor(service) {
    this.service = service;
  }
  register = async (req, res) => {
    const user = await this.service.create(new CreateUserDTO(req.body));

    res.status(201).json({ user });
  };

  login = async (req, res) => {
    const user = await this.service.login(new LoginDTO(req.body));

    await new Promise((resolve, reject) =>
      req.session.regenerate(e => (e ? reject(e) : resolve())),
    );

    req.session.userId = user.id;

    await new Promise((resolve, reject) => req.session.save(e => (e ? reject(e) : resolve())));

    res.json({ user });
  };
  logout = (req, res, next) =>
    req.session.destroy(e => {
      if (e) return next(e);

      res.clearCookie('boarding.sid');
      res.json({ ok: true });
    });

  profile = async (req, res) => {
    const user = await this.service.profile(req.user.id, new ProfileDTO(req.body));

    res.json({ user });
  };
}
