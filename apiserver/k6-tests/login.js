import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.API_URL || 'http://localhost:8010';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const payload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${baseUrl}/api/v1/auth/login`, payload, params);

  check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
