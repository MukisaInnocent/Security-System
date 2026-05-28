import { Test, TestingModule } from '@nestjs/testing';
import { GuardChargesService } from './guard-charges.service';

describe('GuardChargesService', () => {
  let service: GuardChargesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardChargesService],
    }).compile();

    service = module.get<GuardChargesService>(GuardChargesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
