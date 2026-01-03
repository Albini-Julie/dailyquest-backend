import request from "supertest";
import express from "express";
import authRoutes from "../../src/modules/module-user/authRoutes";
import { authMiddleware } from "../../src/middlewares/authMiddleware";

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(),
}));

describe("authRoutes – GET /me edge cases", () => {
  let app: express.Express;

  beforeEach(() => {
    (authMiddleware as jest.Mock).mockImplementation(
      (_req: any, _res: any, next: any) => next()
    );

    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 if req.user is missing", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "Utilisateur non trouvé",
    });
  });
});
