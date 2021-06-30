export default {
  environment: 'development',
  development () {
    return this.environment === 'development';
  },
  production () {
    return this.environment === 'production';
  }
}