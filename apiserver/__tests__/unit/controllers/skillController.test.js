jest.mock('../../../models', () => ({
  Skill: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  LocationOption: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  User: {},
}));

jest.mock('../../../utils/appError');
jest.mock('../../../utils/catchAsync', () => {
  return (fn) => {
    const wrapped = (req, res, next) => fn(req, res, next).catch(next);
    wrapped._mockOriginal = fn;
    return wrapped;
  };
});

const skillController = require('../../../controllers/skillController');
const { Skill, LocationOption } = require('../../../models');
const AppError = require('../../../utils/appError');

describe('skillController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { userId: 1, params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('getAllSkills', () => {
    it('should return all skills', async () => {
      const mockSkills = [{ id: 1, category: 'Music' }, { id: 2, category: 'Sports' }];
      Skill.findAll.mockResolvedValue(mockSkills);

      await skillController.getAllSkills(req, res, next);

      expect(Skill.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: mockSkills,
      });
    });

    it('should return empty array when no skills', async () => {
      Skill.findAll.mockResolvedValue([]);

      await skillController.getAllSkills(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: 'success',
        results: 0,
        data: [],
      });
    });
  });

  describe('getSkillById', () => {
    it('should return a skill by id', async () => {
      const mockSkill = { id: 1, category: 'Music', tagLine: 'Guitar lessons' };
      req.params.skillId = '1';
      Skill.findOne.mockResolvedValue(mockSkill);

      await skillController.getSkillById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: 'success',
        data: mockSkill,
      });
    });
  });

  describe('createSkill', () => {
    it('should create a skill with location options', async () => {
      req.body = {
        category: 'Music',
        tagLine: 'Guitar lessons',
        locationOptions: ['online', 'instructor'],
      };
      const mockSkill = { id: 1, category: 'Music', tagLine: 'Guitar lessons', userId: 1 };
      Skill.create.mockResolvedValue(mockSkill);
      LocationOption.bulkCreate.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await skillController.createSkill(req, res, next);

      expect(Skill.create).toHaveBeenCalledWith({
        category: 'Music',
        tagLine: 'Guitar lessons',
        travelFee: null,
        userId: 1,
      });
      expect(LocationOption.bulkCreate).toHaveBeenCalledWith([
        { option: 'online', skillId: 1 },
        { option: 'instructor', skillId: 1 },
      ]);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error if travelFee without choose option', async () => {
      req.body = {
        category: 'Music',
        tagLine: 'Guitar lessons',
        travelFee: 50,
        locationOptions: ['online'],
      };
      AppError.mockImplementation((code, msg) => ({ statusCode: code, message: msg }));

      await skillController.createSkill(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: expect.stringContaining('Travel fee') })
      );
    });
  });

  describe('deleteSkillById', () => {
    it('should delete a skill and its location options', async () => {
      const mockSkill = { id: 1, userId: 1, destroy: jest.fn() };
      req.params.skillId = '1';
      Skill.findByPk.mockResolvedValue(mockSkill);
      LocationOption.destroy.mockResolvedValue(2);

      await skillController.deleteSkillById(req, res, next);

      expect(Skill.findByPk).toHaveBeenCalledWith('1');
      expect(LocationOption.destroy).toHaveBeenCalledWith({ where: { skillId: 1 } });
      expect(mockSkill.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if skill not found', async () => {
      req.params.skillId = '999';
      Skill.findByPk.mockResolvedValue(null);

      await skillController.deleteSkillById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });

    it('should return 401 if user is not the owner', async () => {
      const mockSkill = { id: 1, userId: 2 };
      req.params.skillId = '1';
      Skill.findByPk.mockResolvedValue(mockSkill);

      await skillController.deleteSkillById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });
});
