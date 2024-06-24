import { testExpressionAPI } from "./api/ExpressionAPI";
import { testDBRepository_insert_get } from "./test/TestDBRepository";
import { testSampleRdbAdapter_insert_get } from "./test/TestSampleRdbAdapter";



await testSampleRdbAdapter_insert_get();
await testDBRepository_insert_get();
await testExpressionAPI();


