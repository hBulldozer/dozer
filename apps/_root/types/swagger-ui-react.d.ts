declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';

  interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    deepLinking?: boolean;
    layout?: string;
    plugins?: Array<object>;
    presets?: Array<object>;
    requestInterceptor?: (req: object) => object;
    responseInterceptor?: (res: object) => object;
    showMutatedRequest?: boolean;
    supportedSubmitMethods?: Array<string>;
    validatorUrl?: string | null;
    withCredentials?: boolean;
    [key: string]: any;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
