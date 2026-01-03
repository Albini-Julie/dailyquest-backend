import { Request, Response } from "express";
import {
  getSubmittedQuests as getSubmittedQuestsController,
  validateCommunityQuest as validateCommunityQuestController,
} from "../../src/modules/module-community/communityController";
import * as communityService from "../../src/modules/module-community/communityService";
import { UserModel } from "../../src/modules/module-user/userModel";
import { UserQuestModel } from "../../src/modules/module-userQuest/userQuestModel";
import { socketService } from "../../src/socket/socketService";

jest.mock("../../src/modules/module-user/userModel");
jest.mock("../../src/modules/module-userQuest/userQuestModel");
jest.mock("../../src/socket/socketService");

const mockRes = (): Response =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any);

const mockUserId = "user-id-123";
const questId = "quest-id-456";

describe("communityController", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("getSubmittedQuests → success", async () => {
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ dailyValidations: 3 }),
    });

    jest
      .spyOn(communityService, "getSubmittedQuests")
      .mockResolvedValue([
        {
          _id: "1",
          status: "submitted",
          proofImage: null,
          toObject: () => ({
            _id: "1",
            status: "submitted",
            proofImage: null,
          }),
        } as any,
      ]);

    const req = { user: { _id: mockUserId } } as Request;
    const res = mockRes();

    await getSubmittedQuestsController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      quests: [
        {
          _id: "1",
          status: "submitted",
          proofImage: null,
          imageUrl: null,
        },
      ],
      dailyValidations: 3,
      dailyLimit: 10,
    });
  });

  it("validateCommunityQuest → error", async () => {
    jest
      .spyOn(communityService, "validateCommunityQuest")
      .mockRejectedValue(new Error("Validation error"));

    const req = {
      user: { _id: mockUserId },
      params: { id: questId },
    } as Request;

    const res = mockRes();

    await validateCommunityQuestController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("communityService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws if quest not found", async () => {
    (UserQuestModel.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      communityService.validateCommunityQuest(mockUserId, questId)
    ).rejects.toThrow("UserQuest not found");
  });

  it("validates quest", async () => {
    const uqMock = {
      _id: questId,
      status: "submitted",
      user: { toString: () => "other-user" },
      validatedBy: [],
      validationCount: 0,
      questPoints: 10,
      save: jest.fn(),
    };

    (UserQuestModel.findById as jest.Mock).mockResolvedValue(uqMock);
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        dailyValidations: 0,
        lastValidationDate: new Date(),
        points: 10,
      }),
    });

    const result = await communityService.validateCommunityQuest(
      mockUserId,
      questId
    );

    expect(result.status).toBe("submitted");
    expect(socketService.emitQuestValidated).toHaveBeenCalled();
  });
});
