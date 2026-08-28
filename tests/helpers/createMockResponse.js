const createMockResponse = () => {
  const response = {
    body: undefined,
    statusCode: 200,
  };

  response.status = jest.fn((statusCode) => {
    response.statusCode = statusCode;
    return response;
  });
  response.json = jest.fn((body) => {
    response.body = body;
    return response;
  });

  return response;
};

module.exports = createMockResponse;
