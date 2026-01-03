import { Request, Response, NextFunction } from "express";
import { adminMiddleware } from "../../src/middlewares/adminMiddleware";

describe("adminMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("retourne 401 si req.user est absent", () => {
    adminMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("retourne 403 si l'utilisateur n'est pas admin", () => {
    req.user = { isAdmin: false } as any;

    adminMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Admin access only" });
    expect(next).not.toHaveBeenCalled();
  });

  it("appelle next() si l'utilisateur est admin", () => {
    req.user = { isAdmin: true } as any;

    adminMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
