export const config = () => ({
  port: Number(process.env.PORT || 3000),
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS
      ? process.env.KAFKA_BROKERS.split(',')
      : [],
    consumerGroupId: process.env.KAFKA_CONSUMER_GROUP_ID,
  },
  retryBaseDelay: Number(process.env.RETRY_BASE_DELAY || 30),
  retryCount: Number(process.env.RETRY_COUNT || 6),
});
