# Use an official Node runtime as a parent image
FROM node:14.15.4

# Set the working directory in the container for the server
WORKDIR /usr/src/app

# Copy the server directory contents into the container at /usr/src/app/server
COPY . .

# Go into server dir to run commands
WORKDIR /usr/src/app/server

# Install server dependencies
RUN npm install && npx tsc && cd ../client && npm install  && npm run  build && mkdir -p ../server/build/static/ && cp -ru ./build/* ../server/build/static/

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Define the command to run the server app
CMD ["npm", "run", "start"]
