import 'package:flutter/material.dart';

import 'app.dart';
import 'client_provider.dart';
import 'config.dart';
import 'user_state_provider.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) => UserStateProvider(
        child: ClientProvider(
            uri: GRAPHQL_ENDPOINT,
            subscriptionUri: SUBSCRIPTION_ENDPOINT,
            child: MaterialApp(
                title: 'Plant Monitoring',
                theme: ThemeData(
                  brightness: Brightness.light,
                  primaryColor: Colors.grey[50],
                  primarySwatch: Colors.grey,
                  accentColor: Colors.black,
                  fontFamily: 'Avenir',
                  textTheme: TextTheme(
                    headline: TextStyle(fontSize: 72.0, fontWeight: FontWeight.bold),
                    title: TextStyle(fontSize: 20.0, fontWeight: FontWeight.bold),
                    body1: TextStyle(fontSize: 14.0),
                    body2: TextStyle(fontSize: 12.0),
                  ),
                ),
                debugShowCheckedModeBanner: false,
                home: App())),
      );
}
