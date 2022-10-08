# Untis-Google

### Used to synchronize webuntis events with your google calendar. Requires an running server with nodejs.

### Step by step instruction

#### Download or clone the repository
Download a release and unzip it or use ```git clone https://github.com/DerArkeN/Untis-Google.git``` in a new folder

#### Setting up ```.env(default)```
Go onto [webuntis](https://webuntis.com) and search for your school

![image](https://user-images.githubusercontent.com/31077445/194700863-1e9e8e2e-93bb-4760-b9d3-fcea18444170.png)

Click on the school and look at the URL

![image](https://user-images.githubusercontent.com/31077445/194700913-ee48d3fe-c87c-4ce6-baf8-a071be304c12.png)

1. Paste the name you can see in the URL at ```SCHOOL=```
2. Paste the link xxx.webuntis.com at ```WEBURL=```
3. Then enter your webuntis login credentials at ```WEBUSER=``` and ```PASSWORD=```

Follow [this](https://developers.google.com/calendar/api/quickstart/nodejs) introduction until step 7.

Then open your ```credentials.json```, make everything into one line and paste it at ```CREDS=```

Next go to [Google Calendar](https://calendar.google.com).

1. Create a new calendar
2. Open the settings of the new calendar
3. Go to "Share with specific people" and click on "Add people"
4. Enter the "client_email" from your ```credentials.json``` and set the permissions to "Make changes and manage sharing"
5. Now scroll "Integrate calendar" and copy the "Calendar ID" to ```CALENDAR_ID=```

Lastly add the classes you want to add to your calendar in the short form that you will find on [webuntis](https://webuntis.com), seperated with a comma.

Your file should look something like this:

![image](https://user-images.githubusercontent.com/31077445/194701967-c52c709e-b688-4ca0-829f-636819949672.png)

Finally save the file as ```.env``` without "(default)"

#### Run the program

1. Run ```npm install``` to get all the required dependencies
2. Run ```node index``` to start the program on your server
3. Use ```node index rewrite``` to delete all calendar events and add them again
4. Use ```node index update``` to start the program and execute an instant update

Have fun.
