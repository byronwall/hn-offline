# Use an official Node runtime as a parent image
FROM node:latest

# Set the working directory in the container for the server
WORKDIR /usr/src/app

# Copy the server directory contents into the container at /usr/src/app/server
COPY . .

# Go into server dir to run commands
WORKDIR /usr/src/app/server

# Install server dependencies
RUN npm build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run the server app
CMD ["npm", "run", "start"]
