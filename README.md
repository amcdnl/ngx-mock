# ngx-mock
A mocking utility library that builds on [Angular In Memory Web Api](https://github.com/angular/in-memory-web-api)
library.

## Usage
The library allows you to decorate methods in the `InMemoryDbService` implementation
using the URL path so you can easily map mock endpoints to mock data.

```javascript
import { matchRoute, MockPost } from 'ngx-mock';

export class InMemoryDb implements InMemoryDbService {
    createDb(reqInfo?: RequestInfo) {
        return [];
    }

    get(reqInfo: RequestInfo) {
        return matchRoute(this)('get', reqInfo);
    }

    put(reqInfo: RequestInfo) {
        return matchRoute(this)('put', reqInfo);
    }

    post(reqInfo: RequestInfo) {
        return matchRoute(this)('post', reqInfo);
    }

    delete(reqInfo: RequestInfo) {
        return matchRoute(this)('delete', reqInfo);
    }
    
    @MockPost('api/requests/approve')
    postRequestApprove(reqInfo) {
        const index = request.findIndex(r => r.requestId === reqInfo.req.body.requestId);
        const request = requests[index];
        request.state.approved = true;
        return { body: request };
    }
}
```