import { Test, TestingModule } from '@nestjs/testing';
import { GuardChargesController } from './guard-charges.controller';

describe('GuardChargesController', () => {
  let controller: GuardChargesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardChargesController],
    }).compile();

    controller = module.get<GuardChargesController>(GuardChargesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
