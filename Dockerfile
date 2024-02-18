# Use an official Node runtime as a parent image
FROM node:14.15.4

# Update package lists and install rsync
RUN apt-get update && apt-get install -y rsync \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container for the server
WORKDIR /usr/src/app

# Copy the server directory contents into the container at /usr/src/app/server
COPY . .

# Go into server dir to run commands
WORKDIR /usr/src/app/server

# Install server dependencies
RUN npm run build

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Define the command to run the server app
CMD ["npm", "run", "start"]
