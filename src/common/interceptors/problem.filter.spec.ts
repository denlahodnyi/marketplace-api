import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { ValidationException } from '../exceptions.js';
import { ProblemFilter } from '../filters/problem.filter.js';

const mockJson = vi.fn();
const mockStatus = vi.fn().mockImplementation(() => ({
  json: mockJson,
  status: mockStatus,
  type: mockType,
}));
const mockType = vi.fn().mockImplementation(() => ({
  json: mockJson,
  status: mockStatus,
  type: mockType,
}));
const mockGetResponse = vi.fn().mockImplementation(() => ({
  status: mockStatus,
  type: mockType,
}));
const mockGetRequest = vi.fn().mockImplementation(() => ({
  originalUrl: '/',
}));
const mockHttpArgumentsHost = vi.fn().mockImplementation(() => ({
  getResponse: mockGetResponse,
  getRequest: mockGetRequest,
}));

const mockArgumentsHost = {
  switchToHttp: mockHttpArgumentsHost,
  getArgByIndex: vi.fn(),
  getArgs: vi.fn(),
  getType: vi.fn(),
  switchToRpc: vi.fn(),
  switchToWs: vi.fn(),
};

describe('GlobalFilter', () => {
  let problemFilter: ProblemFilter<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProblemFilter],
    }).compile();
    problemFilter = module.get<ProblemFilter<any>>(ProblemFilter);
  });

  it('should be defined', () => {
    expect(new ProblemFilter()).toBeDefined();
  });

  it('returns 500, Content-Type: application/problem+json, RFC 9457 compliant body', () => {
    problemFilter.catch(
      new HttpException('some message', HttpStatus.INTERNAL_SERVER_ERROR),
      mockArgumentsHost,
    );
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockType).toHaveBeenCalledWith('application/problem+json');
    expect(mockJson).toHaveBeenCalledWith({
      type: 'auto:blank',
      title: 'Internal server error',
      detail: 'some message',
      status: 500,
      instance: '/',
      errors: null,
    });
  });

  it('returns 400 and errors in case of ValidationException', () => {
    problemFilter.catch(
      new ValidationException({
        detail: "Request didn't pass validation",
        errors: [
          { field: 'A', messages: ['A', 'B'] },
          { field: 'B', messages: ['A', 'B'] },
        ],
      }),
      mockArgumentsHost,
    );
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockType).toHaveBeenCalledWith('application/problem+json');
    expect(mockJson).toHaveBeenCalledWith({
      type: 'auto:blank',
      title: 'Validation Exception',
      detail: "Request didn't pass validation",
      status: 400,
      instance: '/',
      errors: [
        { field: 'A', messages: ['A', 'B'] },
        { field: 'B', messages: ['A', 'B'] },
      ],
    });
  });
});
