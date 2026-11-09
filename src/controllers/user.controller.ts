import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import * as userService from '../service/user.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createInternalUser(req.body);
  res.status(201).json({ success: true, data: user });
});

export const list = catchAsync(async (_req: Request, res: Response) => {
  const users = await userService.getInternalUsers();
  res.status(200).json({ success: true, data: users });
});

export const listDepartments = catchAsync(async (_req: Request, res: Response) => {
  const departments = await userService.getDepartments();
  res.status(200).json({ success: true, data: departments });
});

export const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await userService.createDepartment(req.body);
  res.status(201).json({ success: true, data: department });
});

export const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await userService.deleteDepartment(req.params.id as string);
  res.status(200).json({ success: true, data: department });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateInternalUser(
    req.params.id as string,
    req.body,
    req.user!.id
  );
  res.status(200).json({ success: true, data: user });
});