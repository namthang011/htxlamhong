# Use official Maven image to build the app
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the application (skipping tests for speed)
RUN mvn clean package -DskipTests

# Use a lightweight JRE image to run the app
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/htx-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
