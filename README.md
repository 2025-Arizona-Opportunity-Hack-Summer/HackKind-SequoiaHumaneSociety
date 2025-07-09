
    # 2025_summer Hackathon Project

    ## Quick Links
    - Nonprofit: [Sequoia Humane Society](https://ohack.dev/nonprofit/9ajAkAzo9rnb0IOmE4VY)
    - [Hackathon Details](https://www.ohack.dev/hack/2025_summer)
    - [Team Slack Channel](https://opportunity-hack.slack.com/app_redirect?channel=hackkind)


    ## Creator
    @Nicolas Garzon (on Slack)

    ## Team "HackKind"
    - [Team Member 1](GitHub profile link)
    - [Team Member 2](GitHub profile link)
    - [Team Member 3](GitHub profile link)
    <!-- Add all team members -->

    ## Project Overview
    Brief description of your project and its goals.

    ## Tech Stack
    - Frontend: 
    - Backend: 
    - Database: 
    - APIs: 
    <!-- Add/modify as needed -->


    ## Getting Started
    Instructions on how to set up and run your project locally.

    ```bash
    # Example commands
    git clone [your-repo-link]
    cd [your-repo-name]
    npm install
    npm start
    ```


    ## Your next steps
    1. ✅ Add everyone on your team to your GitHub repo like [this video posted in our Slack channel](https://opportunity-hack.slack.com/archives/C1Q6YHXQU/p1605657678139600)
    2. ✅ Create your DevPost project [like this video](https://youtu.be/vCa7QFFthfU?si=bzMQ91d8j3ZkOD03)
    3. ✅ Use the [this DevPost]() to submit your project
    4. ✅ Your DevPost final submission demo video should be 4 minutes or less
    5. ✅ Review the judging criteria on DevPost

    # What should your final Readme look like?
    Your readme should be a one-stop-shop for the judges to understand your project. It should include:
    - Team name
    - Team members
    - Slack channel
    - Problem statement
    - Tech stack
    - Link to your DevPost project
    - Link to your final demo video
    - Any other information you think is important

    You'll use this repo as your resume in the future, so make it shine! 🌟

    Examples of stellar readmes:
    - ✨ [2019 Team 3](https://github.com/2019-Arizona-Opportunity-Hack/Team-3)
    - ✨ [2019 Team 6](https://github.com/2019-Arizona-Opportunity-Hack/Team-6)
    - ✨ [2020 Team 2](https://github.com/2020-opportunity-hack/Team-02)
    - ✨ [2020 Team 4](https://github.com/2020-opportunity-hack/Team-04)
    - ✨ [2020 Team 8](https://github.com/2020-opportunity-hack/Team-08)
    - ✨ [2020 Team 12](https://github.com/2020-opportunity-hack/Team-12)
    
## AWS S3 Configuration for Image Uploads

To enable image uploads to AWS S3, set the following environment variables in your `.env` file or environment:

```
AWS_S3_ACCESS_KEY_ID=your-access-key-id
AWS_S3_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_S3_REGION=your-s3-region
# Optional: for custom endpoints (e.g., localstack)
# AWS_S3_ENDPOINT_URL=https://s3.your-provider.com
```

- The S3 bucket must exist and the credentials must have permission to `PutObject` and `GetObject` for the bucket.
- The backend will return a public or presigned URL for each uploaded image.
    