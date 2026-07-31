import { afterEach, describe, it } from 'mocha';
import { expect } from 'chai';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';
import { login, register } from '../src/controller/authController.js';

const originalFindOne = User.findOne;
const originalCompare = bcrypt.compare;

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

afterEach(() => {
  User.findOne = originalFindOne;
  bcrypt.compare = originalCompare;
});

describe('authentication controller error contracts', () => {
  it('rejects missing login fields with a stable validation code', async () => {
    const res = createResponse();

    await login({ body: {} }, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body).to.include({ success: false, code: 'VALIDATION_ERROR' });
  });

  it('returns invalid credentials without revealing whether an email exists', async () => {
    User.findOne = async () => null;
    const res = createResponse();

    await login({ body: { email: 'missing@yarnflow.com', password: 'secret123' } }, res);

    expect(res.statusCode).to.equal(401);
    expect(res.body).to.include({ success: false, code: 'INVALID_CREDENTIALS' });
  });

  it('returns a retryable service response when the database is unavailable', async () => {
    User.findOne = async () => { throw new Error('database offline'); };
    const res = createResponse();

    await login({ body: { email: 'user@yarnflow.com', password: 'secret123' } }, res);

    expect(res.statusCode).to.equal(503);
    expect(res.body).to.include({
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      retryable: true,
    });
    expect(res.body).not.to.have.property('error');
  });

  it('returns the duplicate-account contract during registration', async () => {
    User.findOne = async () => ({ _id: 'existing-user' });
    const res = createResponse();

    await register({ body: { email: 'existing@yarnflow.com', password: 'secret123' } }, res);

    expect(res.statusCode).to.equal(409);
    expect(res.body).to.include({ success: false, code: 'EMAIL_ALREADY_REGISTERED' });
  });

  it('blocks disabled accounts with an administrator-directed message', async () => {
    User.findOne = async () => ({ password: 'hash', isActive: false });
    bcrypt.compare = async () => true;
    const res = createResponse();

    await login({ body: { email: 'disabled@yarnflow.com', password: 'secret123' } }, res);

    expect(res.statusCode).to.equal(403);
    expect(res.body).to.include({ success: false, code: 'ACCOUNT_DISABLED' });
  });
});
