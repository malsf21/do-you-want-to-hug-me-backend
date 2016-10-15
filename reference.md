##user-reg
Input: user, real, pass
Behaviour: Takes a username, real name, and password, registers a new user
Return: `boolean` of success

##user-edit
Input: user, real, pass, new_pass
Behaviour: Updates the password and realname of a user
Return: `boolean` of success

##add-plush
Input: user, pass, nickname
Behaviour: registers a new plush with nickname
Return: ID of new plush

##log-data
Input: user, pass, plush, date
Behaviour: adds a row into the table with date and plush ID
Return: `boolean` of success

##get-data
Input: user, pass
Behaviour: not much
Return: all plush entries the user owns

##edit-plush
Currently broken

