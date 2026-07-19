const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({ router: mockRouter }));

import { goBackOrHome } from '@/utils/navigation-utils';

describe('goBackOrHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the existing navigation history when available', () => {
    mockRouter.canGoBack.mockReturnValue(true);

    goBackOrHome();

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('replaces a directly opened route with Home', () => {
    mockRouter.canGoBack.mockReturnValue(false);

    goBackOrHome();

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});
