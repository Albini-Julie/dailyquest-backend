import { Request, Response } from "express";
import {
  proposeQuest,
  getMyProposedQuests,
  getPendingProposedQuests,
  approveProposedQuest,
  rejectProposedQuest,
} from "../../src/modules/module-proposedQuest/proposedQuestController";

import { ProposedQuestModel } from "../../src/modules/module-proposedQuest/proposedQuestModel";
import { QuestModel } from "../../src/modules/module-quest/questModel";
import { socketService } from "../../src/socket/socketService";

jest.mock("../../src/modules/module-proposedQuest/proposedQuestModel");
jest.mock("../../src/modules/module-quest/questModel");
jest.mock("../../src/socket/socketService");

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res as Response;
};

it("retourne 400 si title ou proofExample manquant", async () => {
  const req = {
    body: {},
    user: { _id: "userId" },
  } as Request;

  const res = mockRes();

  await proposeQuest(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

it("crée une quête proposée", async () => {
  (ProposedQuestModel.create as jest.Mock).mockResolvedValue({ id: "qp1" });

  const req = {
    body: { title: "Test", proofExample: "Photo" },
    user: { _id: "userId" },
  } as Request;

  const res = mockRes();

  await proposeQuest(req, res);

  expect(ProposedQuestModel.create).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
});

it("retourne 401 si user absent", async () => {
  const req = {} as Request;
  const res = mockRes();

  await getMyProposedQuests(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
});

it("retourne les quêtes de l'utilisateur", async () => {
  (ProposedQuestModel.find as jest.Mock).mockReturnValue({
    sort: jest.fn().mockResolvedValue(["q1"]),
  });

  const req = { user: { _id: "userId" } } as Request;
  const res = mockRes();

  await getMyProposedQuests(req, res);

  expect(res.json).toHaveBeenCalledWith(["q1"]);
});

it("retourne les quêtes en attente", async () => {
  (ProposedQuestModel.find as jest.Mock).mockReturnValue({
    populate: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(["q1"]),
    }),
  });

  const req = {} as Request;
  const res = mockRes();

  await getPendingProposedQuests(req, res);

  expect(res.json).toHaveBeenCalledWith(["q1"]);
});

it("retourne 404 si la quête n'existe pas", async () => {
  (ProposedQuestModel.findById as jest.Mock).mockResolvedValue(null);

  const req = { params: { id: "1" }, user: { _id: "admin" } } as any;
  const res = mockRes();

  await approveProposedQuest(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
});

it("interdit l'auto-approbation", async () => {
  (ProposedQuestModel.findById as jest.Mock).mockResolvedValue({
    author: { toString: () => "admin" },
  });

  const req = { params: { id: "1" }, user: { _id: "admin" } } as any;
  const res = mockRes();

  await approveProposedQuest(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
});

it("approuve une quête proposée", async () => {
  const proposedQuest = {
    id: "1",
    title: "Test",
    proofExample: "Proof",
    author: { toString: () => "user1" },
    status: "pending",
    save: jest.fn(),
  };

  (ProposedQuestModel.findById as jest.Mock).mockResolvedValue(proposedQuest);
  (QuestModel.create as jest.Mock).mockResolvedValue({});

  const req = { params: { id: "1" }, user: { _id: "admin" } } as any;
  const res = mockRes();

  await approveProposedQuest(req, res);

  expect(QuestModel.create).toHaveBeenCalled();
  expect(socketService.emitProposedQuestReviewed).toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith(proposedQuest);
});

it("rejette une quête proposée", async () => {
  const proposedQuest = {
    id: "1",
    title: "Test",
    author: { toString: () => "user1" },
    status: "pending",
    save: jest.fn(),
  };

  (ProposedQuestModel.findById as jest.Mock).mockResolvedValue(proposedQuest);

  const req = { params: { id: "1" }, user: { _id: "admin" } } as any;
  const res = mockRes();

  await rejectProposedQuest(req, res);

  expect(socketService.emitProposedQuestReviewed).toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith(proposedQuest);
});
