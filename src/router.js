import React from 'react';
import { Router, Route, Switch, routerRedux } from 'dva/router';
import dynamic from 'dva/dynamic';

const { ConnectedRouter } = routerRedux;

const routes = [{
    path: '/',
    models: () => [import('./models/commonM'),import('./models/GPSRealTimeM')],
    component: () => import('./routes/GPSRealTime/index')
},{
    path: '/realTime',
    models: () => [import('./models/commonM'),import('./models/GPSRealTimeM')],
    component: () => import('./routes/GPSRealTime/index')
},{
    path: '/history',
    models: () => [import('./models/commonM'),import('./models/GPSHistoryM')],
    component: () => import('./routes/GPSHistory/index')
},{//加油查询
    path: '/refuelList',
    models: () => [import('./models/commonM'),import('./models/refuelListM')],
    component: () => import('./routes/RefuelList')
},{//油耗异常
    path: '/oilException',
    models: () => [import('./models/commonM'),import('./models/oilExceptionM')],
    component: () => import('./routes/OilException')
},{//加油站管理
    path: '/stationManage',
    models: () => [import('./models/commonM'),import('./models/stationManageM')],
    component: () => import('./routes/StationManage')
}];

function RouterConfig({ history, app }) {
    return (
        <Router history={history}>
        <Switch>
            {
                routes.map(({ path, ...dynamics }, key) => (
                    <Route
                        key={key}
                        exact
                        path={path}
                        component={dynamic({
                        app,
                        ...dynamics,
                        })}
                    />
                ))
            }
        </Switch>
        </Router>
    );
}


// import RealTime from './routes/realTime';

// function RouterConfig({ history, app }) {
//     return (
//         <Router history={history}>
//             <Route path="/realTime" component={RealTime} />
//         </Router>
//     );
// }

export default RouterConfig;
