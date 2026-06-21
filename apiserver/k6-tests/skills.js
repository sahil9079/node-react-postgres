import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.API_URL || 'http://localhost:8010';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.10'],
  },
};

export default function () {
  const res = http.get(`${baseUrl}/api/v1/skills`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(res, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(1);
}
