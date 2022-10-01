# Doppler Coding Project

### Introduction

Hi, I'm Rob Johansen. Thanks for giving me the opportunity to interview with Doppler!
I enjoyed working through this take-home assessment, and I'd like to highlight some
of my thoughts as I went along—particularly in regard to attack vectors:

##### Denial of Service

I added support for basic rate limiting to illustrate that this was on my mind, although
in a real tokenization service the rate limiting might look very different.

##### Authentication

I wanted to be certain that users of the service would only be able to access their own
tokens and secrets. I addressed this by requiring an API key as a bearer token in the
HTTP `Authorization` header (all endpoints require this authentication).

##### Validation

Where applicable, each endpoint returns early if the required input is missing or malformed.

##### Information

I designed the service to provide as little information as possible:

- The `x-powered-by` header is disabled
- All client errors result in a 400 status, making it impossible to probe the endpoints with
  varying inputs and glean information from changing status codes. I acknowledge that this
  is a controversial decision.

##### Tests

I added one or more tests for every endpoint, so there is some measure of reassurance that
each is working properly.

### Setup

To run the project locally:

1. Make sure you have Node.js installed. I use [nvm](https://github.com/nvm-sh/nvm) to
   manage multiple versions of Node.js, and tested this project with Node.js v16.14.0.
2. Clone this repository:
    
    ```
    git clone https://github.com/rob-johansen/doppler.git
    ```
    
3. Install dependencies:
    
    ```
    npm install
    ```
    
4. Start the server on port 3000:
    
    ```
    npm start
    ```
    
5. Send requests using a tool like curl or Postman. Here are curl examples for each endpoint:
    
    **POST**
    
    ```
    curl 'http://localhost:3000/tokens' \
      --header 'Content-Type: application/json' \
      --header 'Authorization: Bearer API-KEY-1' \
      --data '{"secret":"password"}'
    ```
    
    **GET**
    
    ```
    curl 'http://localhost:3000/tokens?t=<TOKEN>' \
      --header 'Content-Type: application/json' \
      --header 'Authorization: Bearer API-KEY-1'
    ```
    
    **PUT**
    
    ```
    curl 'http://localhost:3000/tokens/<TOKEN>' \
      --header 'Content-Type: application/json' \
      --header 'Authorization: Bearer API-KEY-1' \
      --request 'PUT' \
      --data '{"secret":"drowssap"}' \
      --verbose
    ```
    
    **DELETE**
    
    ```
    curl 'http://localhost:3000/tokens/<TOKEN>' \
      --header 'Content-Type: application/json' \
      --header 'Authorization: Bearer API-KEY-1' \
      --request 'DELETE' \
      --verbose
    ```

Execute the following to run tests:

```
npm test
```
