import { CreateUserDTO, LoginDTO, ProfileDTO } from '../users/users.dto.js';
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
  changePassword = async (req, res) => {
    await this.service.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.json({ ok: true });
  };
  verifyEmail = async (req, res) => {
    await this.service.verifyEmail(req.body.email, req.body.code);
    res.json({ ok: true });
  };
  resendVerification = async (req, res) => {
    await this.service.resendVerification(req.body.email);
    res.json({ ok: true });
  };
  requestPasswordReset = async (req, res) => {
    await this.service.requestPasswordReset(req.body.email);
    res.json({ ok: true, message: 'If the account exists, a verification code has been sent.' });
  };
  resetPassword = async (req, res) => {
    await this.service.resetPassword(req.body.email, req.body.code, req.body.newPassword);
    res.json({ ok: true });
  };
}
