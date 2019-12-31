## actor-check-compute-per-actor

This is a simple actor to check your compute units usage on Apify for each of your actor. We are planning to add this feature to the app itself, so after that this actor will be deprecated.

### usage

If you run this actor, it will go through all of your actor and their runs for the previous day/month and calculate their sum. It doesn't matter if you run it in the morning or evening because it always counts the previous day/month. The object with the data is then stored into the default key value store of the run.

### input
- checkTime<`String`>: Can be either `last-day`, `last-month` or `this-month`

### warning!

This actor is only usable if you have up to few thousands of runs totally since it has to make a separate API call for each run. There is a throttling of max 20 API calls per second.
