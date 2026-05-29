import React from 'react';
import { get } from "lodash-es";

class ErrorMsg extends React.Component {

    render() {

        const { error } = this.props;
        return (
            <div>
                {error.message && <h3>
                    {error.message}
                </h3>}
                {get(error, 'response.data.message') && <p>
                    {get(error, 'response.data.message')}
                </p>}
                {get(error, 'response.data.details') && <p>
                    {get(error, 'response.data.details')}
                </p>}
                {get(error, 'config.method') && <p>
                    HTTP method: <strong>{get(error, 'config.method').toUpperCase()}</strong>
                </p>}
                {get(error, 'response.request.responseURL') &&
                    <p><a href={get(error, 'response.request.responseURL')} target="_blank">{get(error, 'response.request.responseURL')}</a></p>}
                 {get(error, 'config.data') && typeof get(error, 'config.data') === 'string' && <div>
                     <h4>Body:</h4>
                     <p>
                     {get(error, 'config.data')}
                </p></div>}
            </div>

        );
    }
}



export default ErrorMsg;
