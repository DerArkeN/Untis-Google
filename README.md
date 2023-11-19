# Untis-Google

### Used to synchronize webuntis events with your Google calendar. Requires a running server with NodeJS.

### Functionality
Enters your specified webuntis lessons in your Google calendar with room and teacher. Cancelled lessons will be marked red.

### Step by step instruction

#### Download or clone the repository
Download a release and unzip it.

#### Setting up ```.env.sample```
Go onto [webuntis](https://webuntis.com) and search for your school

![image](https://user-images.githubusercontent.com/31077445/194700863-1e9e8e2e-93bb-4760-b9d3-fcea18444170.png)

Click on the school and copy the URL.

![image](https://user-images.githubusercontent.com/31077445/194700913-ee48d3fe-c87c-4ce6-baf8-a071be304c12.png)

1. Paste the URL at ```SCHOOLURL=""```.

Follow [this](https://developers.google.com/calendar/api/quickstart/nodejs) introduction until step 7.

Then open your ```credentials.json```, make everything into one line and paste it at ```CREDS=```

Next go to [Google Calendar](https://calendar.google.com).

1. Create a new calendar
2. Open the settings of the new calendar
3. Go to "Share with specific people" and click on "Add people"
4. Enter the "client_email" from your ```credentials.json``` and set the permissions to "Make changes and manage sharing"
5. Now scroll "Integrate calendar" and copy the "Calendar ID" to ```CALENDAR_ID=```

Next add the time interval the calendar shall update, it is recommended to use 30min or more.
Then add the classes you want to add to your calendar in the short form that you will find on [webuntis](https://webuntis.com), seperated with a comma or leave empty for all classes.
Lastly enter a range of days in which the synchronisation takes place.

Your file should look something like this (outdated):
![image](https://github.com/DerArkeN/Untis-Google/assets/31077445/17cb2100-7d05-427d-b405-68733ed76504)

Finally save the file as ```.env``` without ".sample"

#### Run the program

1. Run ```npm install``` to get all the required dependencies
2. Run ```npm run start``` to start the program on your server
3. Use ```npm run rewrite``` to delete all calendar events and add them again

Have fun.

#### Pushsaver integration (optional)
If you want push notifications you can use a pushsaver integration for your program.
Click [here](https://www.pushsafer.com/) for more information.
1. Change ``PUSHENABLED=`` from 'false' to 'true' in your .env file
2. Enter your API Key as well as your device ID
3. (Re)start the program
