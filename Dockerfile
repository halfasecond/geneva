# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock files
COPY package.json yarn.lock ./
COPY . ./

RUN yarn

# Expose the port that the app will run on (optional)
EXPOSE 3131
# $PURR client
EXPOSE 7001
# Paddock client
EXPOSE 7002

# Default command to keep the container running
CMD ["sh", "-c", "yarn start"]