const PRODUCTION = process.env.NODE_ENV === 'production';

export default src => (PRODUCTION ? src : `../../../images${src}`);
