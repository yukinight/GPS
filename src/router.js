import React from 'react';
import { Router, Route, Switch, routerRedux } from 'dva/router';
import dynamic from 'dva/dynamic';

const { ConnectedRouter } = routerRedux;

const routes = [{
    path: '/',
    models: () => [],
    component: () => import('./routes/IndexPage')
},{
    path: '/realTime',
    models: () => [import('./models/GPSRealTimeM')],
    component: () => import('./routes/GPSRealTime/index')
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
